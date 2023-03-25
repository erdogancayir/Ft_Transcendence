FROM debian:buster

RUN apt update; \
    apt install npm -y; \
	apt install curl wget -y;

RUN npm install -g n;

RUN n lts;

COPY ./motd /etc/motd

RUN apt update && apt install  openssh-server sudo -y

RUN useradd -rm -d /home/omeryumusak -s /bin/bash -g root -G sudo -u 1000 webapi

RUN  echo 'webapi:0C1hK9yJY79VJ9tu6wwW' | chpasswd

RUN service ssh start

EXPOSE 22


COPY ./conf /home/omeryumusak/webapi
#COPY ../../.env /home/omeryumusak/webapi
COPY ./runsametime.sh /

RUN cd /home/omeryumusak/webapi && npm install; 

CMD ["sh", "runsametime.sh"]



