from girder_client import GirderClient
import json
import pymongo
import sys

if len(sys.argv) < 2:
    print "%s /path/to/ArborWebApps" % sys.argv[0]
    sys.exit(1)
arborWebAppsPath = sys.argv[1]

# Get the ID for our Analyses folder.
c = GirderClient(host='localhost', port=9000)
c.authenticate('girder', 'girder')
folderSearch = c.get('resource/search', parameters={
    'q': 'Analyses',
    'types': '["folder"]'
})
folderId = folderSearch['folder'][0]['_id']

# Disable authorization requirements for running romanesco tasks
c.put('system/setting', parameters={
    'key': 'romanesco.require_auth',
    'value': 'false'
})

# Check if these analyses already exist.  If so, we won't re-upload them.
uploadACR = False
uploadPGS = False

searchACR = c.get('resource/search', {
    'q': 'aceArbor',
    'types': '["item"]'
})
if len(searchACR['item']) == 0:
  uploadACR = True

searchPGS = c.get('resource/search', {
    'q': 'Phylogenetic signal',
    'types': '["item"]'
})
if len(searchPGS['item']) == 0:
  uploadPGS = True

# Read our analyses into Python dictionaries and upload them to girder.
if uploadACR:
  ACR = {}
  with open ("%s/ancestral-state/aceArbor.json" % arborWebAppsPath, "r") as acrFile:
      acrStr = acrFile.read()
  ACR['analysis'] = json.loads(acrStr)
  item = c.createItem(folderId, 'aceArbor', 'Ancestral state reconstruction')
  c.addMetadataToItem(item['_id'], ACR)
  print "aceArbor successfully uploaded"
else:
  print "aceArbor already exists"

if uploadPGS:
  PGS = {}
  with open ("%s/phylogenetic-signal/Phylogenetic_signal.json" % arborWebAppsPath, "r") as pgsFile:
      pgsStr = pgsFile.read()
  PGS['analysis'] = json.loads(pgsStr)
  item = c.createItem(folderId, 'Phylogenetic signal', 'Phylogenetic signal')
  c.addMetadataToItem(item['_id'], PGS)
  print "Phylogenetic signal successfully uploaded"
else:
  print "Phylogenetic signal already exists"
