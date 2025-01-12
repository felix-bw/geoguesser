FROM node:18
# Update und Installation von SSH-Server
RUN apt-get update && apt-get install -y openssh-server postgis supervisor


#Konfiguration vorbereiten
RUN mkdir /var/run/sshd
RUN echo 'root:root' | chpasswd

# Supervisor-Konfiguration erstellen
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Arbeitsverzeichnis im Container erstellen
WORKDIR /app

# Abhängigkeiten installieren
COPY package.json yarn.lock ./
RUN yarn install

# Anwendungscode kopieren
COPY . .

# Ports für Next.js und SSH öffnen
EXPOSE 3000
EXPOSE 22

# Supervisor starten, um beide Dienste zu managen
CMD ["/usr/bin/supervisord"]
