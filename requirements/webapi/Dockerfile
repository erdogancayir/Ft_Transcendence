# Debian Buster temel imajının kullanılması
FROM debian:buster

# Gerekli paketlerin kurulumu ve Node.js'in LTS sürümünün yüklenmesi
RUN apt-get update && \
    apt-get install -y curl wget openssh-server sudo npm && \
    npm install -g n && \
    n lts

# SSH sunucusu için dizinlerin oluşturulması ve başlatılması
RUN mkdir /run/sshd && \
    chmod 0755 /run/sshd && \
    service ssh start

# Uygulama için gerekli kullanıcı hesabının oluşturulması ve ayarlanması
RUN useradd -rm -d /home/erdogancayir -s /bin/bash -g root -G sudo -u 1000 webapi && \
    echo 'webapi:0C1hK9yJY79VJ9tu6wwW' | chpasswd

# Bağımlılıkların yüklenmesi ve uygulama dosyalarının kopyalanması
COPY ./conf /home/erdogancayir/webapi
COPY ./runsametime.sh /

RUN cd /home/erdogancayir/webapi && npm install

# Konteynerin başlangıç noktası
CMD ["sh", "runsametime.sh"]

# run with manuel
#docker build -t mywebapi .
#docker run -d -p 2222:22 --name mycontainer mywebapi
#docker exec -it mycontainer sh 
#cd /home/erdogancayir/webapi ; npm run start:dev


#sudo lsof -i :2222 