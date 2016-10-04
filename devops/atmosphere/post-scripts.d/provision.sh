#!/bin/bash
set -e

GIRDER_USER="girder"

# Setup Girder user and give sudo access for Ansible
useradd "$GIRDER_USER" --home "/home/$GIRDER_USER"
echo "$GIRDER_USER ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

mkdir -p /home/girder
chown girder:girder /home/girder

# Install ansible and prerequisite system packages
apt-get update
apt-get install --assume-yes git python-pip libyaml-dev python-cffi libffi-dev python-dev libssl-dev
pip install -U ansible

# Checkout latest release of Flow
TMP_DIR=$(mktemp -d)
git clone https://github.com/Kitware/flow.git "$TMP_DIR"
git checkout "$(git describe --tags $(git rev-list --tags --max-count=1))"

# Prepare ansible to be run
PROV_DIR="$TMP_DIR/devops/ansible"
pushd "$PROV_DIR"

# Create inventory file to provision localhost
echo -e "[girder]\nlocalhost\n[rabbitmq]\nlocalhost\n[mongo]\nlocalhost" > inventory

chown -R girder:girder "$TMP_DIR"

# Pull galaxy roles
su - girder -c "ansible-galaxy install --role-file $PROV_DIR/requirements.yml \
                                       --roles-path $PROV_DIR/roles"

# Run ansible to provision Flow
su - girder -c "ansible-playbook --inventory $PROV_DIR/inventory \
                                 --connection=local $PROV_DIR/site.yml"

# Change branding to Arbor
su - girder -c "sed -i 's/TangeloHub/Arbor/' /opt/girder/plugins/flow/server/__init__.py"

# Remove GIRDER_USER from sudoers
sed -i.bak "/^$GIRDER_USER/d" /etc/sudoers
