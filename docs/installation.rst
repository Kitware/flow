====================
    Installation
====================

The TangeloHub application requires several components, including
`Girder <http://girder.readthedocs.org/en/latest/installation.html>`_.
Follow the link for install instructions. After following the Girder install,
you should also have a MongoDB instance running on your machine.

We also need the Romanesco Girder plugin and web interface.
To install them, use the ``girder-install`` command: ::

    sudo girder-install -f web
    git clone https://github.com/Kitware/romanesco.git
    sudo girder-install -f plugin -s ./romanesco

Install an appropriate Girder config file: ::

    sudo cp tangelohub/devops/local/girder.local.cfg path/to/site-packages/girder/conf/

You can find your ``path/to/site-packages`` with: ::

    python
    >>> import site
    >>> site.getsitepackages()

Start Girder: ::

    python -m girder

Running the Romanesco worker requires that you first install
`R <http://www.r-project.org/>`_. After you have R installed,
start a Romanesco worker with: ::

    cd romanesco
    sudo pip install -r requirements.txt
    python -m romanesco

TangeloHub requires npm and Grunt, which should already have been
installed as part of the Girder installation: ::

    curl http://npmjs.org/install.sh | sh
    sudo npm install -g grunt

Now checkout the TangeloHub repository. As a team developer: ::

    git clone git@github.com:Kitware/tangelohub.git

Or as a contributor: ::

    git clone https://github.com/Kitware/tangelohub.git

Enter the source folder and build out all the npm dependencies: ::

    cd tangelohub
    npm install

Now we're ready to build the TangeloHub app: ::

    grunt init
    grunt

Use something like the following Apache file in the ``sites-available``
folder (you can simply replace the `default` file there):

.. code-block:: apacheconf

    Listen 9080

    <VirtualHost *:9080>
        DocumentRoot /path/to/tangelohub/app
        ProxyPass /girder http://localhost:9000
        ProxyPassReverse /girder http://localhost:9000
    </VirtualHost>

After restarting Apache (``sudo apache2ctl restart``), visit your Girder web interface at
`http://localhost:9080/girder <http://localhost:9080/girder>`_ to enable the Romanesco plugin
from the admin console. A restart of Girder is required to fully enable the Romanesco plugin.

Now you should be able to visit the running TangeloHub instance at
`http://localhost:9080 <http://localhost:9080>`_.
