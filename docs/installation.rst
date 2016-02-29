====================
    Installation
====================

Vagrant Install
---------------

A Vagrant install is an easy way to get everything running in a local virtual machine.
This includes an install of MongoDB, Girder, Romanesco, Apache, and the Flow application.
To get started, install `Vagrant <http://www.vagrantup.com/>`_,
`VirtualBox <https://www.virtualbox.org/>`_,
and `Ansible <http://docs.ansible.com/intro_installation.html>`_.
It's then a matter of cloning this repository and running ``vagrant up``: ::

    git clone https://github.com/Kitware/flow.git
    cd flow
    vagrant up

When that completes (it will take some time - get a coffee),
visit `http://localhost:8080/ <http://localhost:8080/>`_ to visit the interface.

To see the Girder interface, visit `http://localhost:8080/girder <http://localhost:8080/girder>`_.

To create new analyses and save data, login to Flow or Girder with username `girder` and password `girder`.

To log in to your virtual machine, run: ::

    vagrant ssh

From that environment, you can restart Romanesco: ::

    sudo stop romanesco
    sudo start romanesco

To view the Romanesco log for analysis debugging: ::

    sudo cat /var/log/upstart/romanesco.log

To restart Girder: ::

    sudo stop girder
    sudo start girder

To enter a local MongoDB shell: ::

    mongo

The default Vagrant install will also install several R libraries needed for Arbor analyses,
which takes a significant amount of time. To turn off this step, edit
``devops/ansible/playbook.yml`` and set the ``arbor`` variable to ``false``.

Ansible Installation
--------------------

.. note::
   Using Ansible with Flow requires Ansible (version >= 1.9.3 and < 2.0).

The Vagrant installation is actually just an instrumentation of using Flow's packaged Ansible playbooks on a virtual machine.

The Ansible playbooks can be used on any machine supporting Ansible's `requirements <http://docs.ansible.com/ansible/intro_installation.html#basics-what-will-be-installed>`_.

Start by creating an inventory file for Ansible, this is a list of hosts (to which you have SSH access) that our roles will be installed on. Ansible has excellent documentation on their `Inventory <http://docs.ansible.com/ansible/intro_inventory.html>`_ - but these are the roles you will want to setup for Flow ::

  [all]
  user@some-host

  [mongo]
  user@some-host

  [girder]
  user@some-host

  [rabbitmq]
  user@some-host


Save this to a location you can reference, and then run the following to provision Flow ::

  ansible-playbook -i path/to/inventory/file devops/ansible/site.yml


This may take a while, but at the end you should have a working version of Flow at `http://localhost:8080/ <http://localhost:8080/>`_.



