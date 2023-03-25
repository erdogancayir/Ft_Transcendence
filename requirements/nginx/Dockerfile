FROM debian:buster

RUN apt update; \
    apt install -y nginx 

COPY ./conf/default etc/nginx/sites-enabled/default
#https://www.coderrocketfuel.com/article/default-nginx-configuration-file-inside-sites-available-default
EXPOSE 443
#bknz pdf
CMD ["nginx", "-g", "daemon off;"]
#-g global değişkeni set eder, deamon off -> ana process haline getirir.