from GirderClient import *
import json
import pymongo
import sys

if len(sys.argv) < 2:
    print "%s /path/to/ArborWebApps" % sys.argv[0]
    sys.exit(1)
arborWebAppsPath = sys.argv[1]

# Get the ID for our Analyses folder.
c = GirderClient('localhost', 9000)
c.authenticate('girder', 'girder')
folderSearch = c.sendRestRequest('GET', 'resource/search', {
    'q': 'Analyses',
    'types': '["folder"]'
})
folderId = folderSearch['folder'][0]['_id']

# Check if these analyses already exist.  If so, we won't re-upload them.
uploadACR = False
uploadPGS = False

searchACR = c.sendRestRequest('GET', 'resource/search', {
    'q': 'aceArbor',
    'types': '["item"]'
})
if len(searchACR['item']) == 0:
  uploadACR = True

searchPGS = c.sendRestRequest('GET', 'resource/search', {
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
  itemId = c.createItem(folderId, 'aceArbor', 'Ancestral state reconstruction')
  c.addMetaDataToItem(itemId, ACR)
  print "aceArbor successfully uploaded"
else:
  print "aceArbor already exists"

if uploadPGS:
  PGS = {}
  with open ("%s/phylogenetic-signal/Phylogenetic_signal.json" % arborWebAppsPath, "r") as pgsFile:
      pgsStr = pgsFile.read()
  PGS['analysis'] = json.loads(pgsStr)
  itemId = c.createItem(folderId, 'Phylogenetic signal', 'Phylogenetic signal')
  c.addMetaDataToItem(itemId, PGS)
  print "Phylogenetic signal successfully uploaded"
else:
  print "Phylogenetic signal already exists"
