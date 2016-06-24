#!/bin/bash
set -e

TMP_DIR=$(mktemp -d)

# Checkout latest release of Flow
git clone https://github.com/Kitware/flow.git $TMP_DIR
pushd $TMP_DIR
git checkout "$(git describe --tags $(git rev-list --tags --max-count=1))"

# Create inventory file to provision localhost
# This only provisions the "girder" host (updating Girder and Flow)
pushd $TMP_DIR/devops/ansible
echo -e "[girder]\nlocalhost" > inventory

# Run ansible on localhost
ansible-playbook --inventory inventory --connection=local site.yml
