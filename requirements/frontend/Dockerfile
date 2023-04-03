FROM debian:buster

# Paketlerin güncellenmesi ve gerekli paketlerin yüklenmesi
RUN apt-get update && \
    apt-get install -y curl wget openssh-server sudo npm && \
    npm install -g n && \
    n lts

# SSH sunucusu için dizinlerin oluşturulması ve başlatılması
RUN mkdir /run/sshd && \
    chmod 0755 /run/sshd && \
    service ssh start && \
    mkdir -p /home/erdogancayir/frontend

# SSH sunucusu için kullanıcı hesabının oluşturulması ve ayarlanması
RUN useradd -rm -d /home/erdogancayir -s /bin/bash -g root -G sudo -u 1000 front && \
    echo 'front:NHLj1KHnmCpKsDQg6HoW' | chpasswd

# Uygulama dosyalarının kopyalanması ve bağımlılıkların yüklenmesi
COPY ./conf /home/erdogancayir/frontend
RUN cd /home/erdogancayir/frontend && npm install && npm run build

# SSH sunucusunun bağlantı noktasının açılması
EXPOSE 22

# Konteynerin başlatılması için varsayılan komut
CMD ["/usr/sbin/sshd", "-D"]

#docker build -t myimage .
#docker run -d -p 2222:22 --name mycontainer myimage

# to run with manuel
## sudo docker exec -it mycontainer sh
## sudo cd /home/erdogancayir/frontend ; npm run serve