FROM debian:buster

RUN apt update; \
    apt install npm -y; \
	apt install curl wget -y;


RUN npm install -g n;

RUN n lts;

COPY ./motd /etc/motd



RUN apt update && apt install  openssh-server sudo -y

RUN useradd -rm -d /home/omeryumusak -s /bin/bash -g root -G sudo -u 1000 front

RUN  echo 'front:NHLj1KHnmCpKsDQg6HoW' | chpasswd

RUN service ssh start

EXPOSE 22



COPY ./conf /home/omeryumusak/frontend
#COPY ../../.env /home/omeryumusak/frontend
COPY ./runsametime.sh /

RUN cd /home/omeryumusak/frontend && npm install && npm run build;

CMD ["sh", "runsametime.sh"]



