Vagrant.configure(2) do |config|
  config.vm.box = "ubuntu/trusty64"

  if Vagrant.has_plugin?("vagrant-cachier")
    config.cache.scope = :box
    config.cache.enable :apt
    config.cache.enable :npm
    config.cache.enable :generic, {
      "R" => { cache_dir: "/usr/local/lib/R" }
    }
  end

  config.vm.provider "virtualbox" do |v|
    v.memory = 4096
    v.cpus = 2
  end

  config.vm.network "forwarded_port", guest: 8080, host: 8080

  config.vm.define "flow" do |node| end

  config.vm.provision "ansible" do |ansible|
    ansible.verbose = ENV["ANSIBLE_VERBOSE"] | ""

    ansible.groups = {
      "all" => ['flow'],
      "girder" => ['flow'],
      "mongo" => ['flow'],
      "rabbitmq" => ['flow']
    }

    ansible.extra_vars = {
      default_user: "vagrant",
      flow_version: ENV["FLOW_VERSION"] || `git rev-parse --short HEAD`.delete!("\n")
    }

    ansible.playbook = "devops/ansible/site.yml"
    ansible.galaxy_role_file = "devops/ansible/requirements.yml"
  end
end
