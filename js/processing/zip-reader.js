/**
 * Reads a Claude export ZIP file and extracts every known data file:
 * conversations.json (required), users.json, projects.json, memories.json.
 * Reports progress via callback.
 */

const KNOWN_FILES = ['conversations', 'users', 'projects', 'memories'];

export async function readExportZip(file, onProgress) {
  if (!window.JSZip) {
    throw new Error('JSZip not loaded. Check CDN link.');
  }

  onProgress('Reading ZIP file...', 10);

  const zip = await JSZip.loadAsync(file);

  onProgress('Searching for export files...', 25);

  // Find known files - could be at root or nested
  const entries = {};
  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const name = path.split('/').pop().toLowerCase();
    const key = name.replace(/\.json$/, '');
    if (name.endsWith('.json') && KNOWN_FILES.includes(key) && !entries[key]) {
      entries[key] = entry;
    }
  }

  if (!entries.conversations) {
    // Try finding any other JSON array that looks like conversations
    for (const [path, entry] of Object.entries(zip.files)) {
      if (entry.dir || !path.endsWith('.json')) continue;
      const preview = await entry.async('string').then(s => s.slice(0, 2000));
      if (preview.trim().startsWith('[') && preview.includes('chat_messages')) {
        entries.conversations = entry;
        break;
      }
    }
  }

  if (!entries.conversations) {
    throw new Error(
      'Could not find conversations.json in the ZIP. ' +
      'Make sure this is a Claude data export (Settings > Privacy > Export Data).'
    );
  }

  const result = { conversations: [], users: [], projects: [], memories: [], warnings: [] };
  let step = 0;
  for (const key of KNOWN_FILES) {
    const entry = entries[key];
    step++;
    if (!entry) {
      if (key !== 'conversations') result.warnings.push(`${key}.json not found in the ZIP.`);
      continue;
    }
    onProgress(`Parsing ${key}.json...`, 30 + Math.round((step / KNOWN_FILES.length) * 60));
    const jsonString = await entry.async('string');
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      if (key === 'conversations') throw new Error('Failed to parse conversations.json: ' + e.message);
      result.warnings.push(`Failed to parse ${key}.json: ${e.message}`);
      continue;
    }
    // memories.json may be a single object rather than an array
    if (!Array.isArray(parsed)) parsed = parsed && typeof parsed === 'object' ? [parsed] : [];
    result[key] = parsed;
  }

  onProgress('Done reading ZIP.', 100);

  return result;
}

/**
 * List all files in a ZIP for debugging.
 */
export async function listZipContents(file) {
  const zip = await JSZip.loadAsync(file);
  const entries = [];
  for (const [path, entry] of Object.entries(zip.files)) {
    if (!entry.dir) {
      entries.push({
        path,
        size: entry._data ? entry._data.uncompressedSize : 0
      });
    }
  }
  return entries;
}
