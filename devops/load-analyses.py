from girder_client import GirderClient
import json
import os
import pymongo
import sys

if len(sys.argv) < 2:
    print "%s /path/to/arborCollections" % sys.argv[0]
    print "This should be the root of a directory tree containing .json analysis files"
    sys.exit(1)
arbor_collections_path = sys.argv[1]

# Authenticate with Girder.
c = GirderClient(host='localhost', port=8080)
c.authenticate('girder', 'girder')

# Recursively search the specified directory for .json files.
for root, dirs, files in os.walk(arbor_collections_path):
  for file in files:
    if not file.endswith(".json"):
      continue

    # Get the name of this file and the directory that it's in.
    # We use the directory name as the collection name in Girder.
    fullpath = os.path.join(root, file)
    analysis_filename = os.path.basename(fullpath)
    analysis_name = os.path.splitext(analysis_filename)[0]
    analysis_dir = os.path.dirname(fullpath)
    collection_name = os.path.basename(analysis_dir)

    # Create this collection if it doesn't already exist.
    collection_search = c.get('resource/search', parameters={
        'q': collection_name,
        'types': '["collection"]'
    })
    if len(collection_search["collection"]) == 0:
        collection = c.post('collection', parameters={
            'name': collection_name,
            'description': collection_name,
            'public': 'true'
        })
        c.post('folder', parameters={
            'parentType': 'collection',
            'parentId': collection['_id'],
            'name': 'Data',
            'description': 'Data Folder',
            'public': 'true'
        })
        c.post('folder', parameters={
            'parentType': 'collection',
            'parentId': collection['_id'],
            'name': 'Analyses',
            'description': 'Analysis folder',
            'public': 'true'
        })
    else:
        collection = collection_search['collection'][0]

    # Get the 'Analyses' folder for this collection.
    analysis_folder = c.load_or_create_folder('Analyses', collection['_id'], 'collection')
    folder_id = analysis_folder['_id']

    # Read this analysis into a Python dictionary and upload it to Girder.
    analysis = {}
    with open (fullpath, "r") as analysis_file:
        analysis_str = analysis_file.read()
    try:
      analysis['analysis'] = json.loads(analysis_str)
    except ValueError:
      print "Could not read valid JSON from %s" % analysis_filename
      continue
    item = c.createItem(folder_id, analysis_name, analysis_name)
    c.addMetadataToItem(item['_id'], analysis)
    print "%s successfully uploaded to %s" % (analysis_filename, collection_name)
