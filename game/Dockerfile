FROM node:18

RUN apt-get update && apt-get install -y openssh-server supervisor


RUN mkdir /var/run/sshd
RUN echo 'root:root' | chpasswd


COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf


WORKDIR /app


COPY package.json yarn.lock ./
RUN yarn install

COPY . .

EXPOSE 3002
EXPOSE 4000



CMD ["/usr/bin/supervisord"]
