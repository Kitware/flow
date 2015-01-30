FROM coreos/apache
MAINTAINER Jeffrey Baumes <jeff.baumes@kitware.com>

RUN a2enmod proxy_http

RUN apt-get update
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup | bash -
RUN apt-get install -y nodejs
RUN npm install -g grunt-cli

COPY . /tangelohub
WORKDIR /tangelohub

RUN npm install
RUN grunt init && grunt

ENTRYPOINT ["/tangelohub/devops/docker/start"]
