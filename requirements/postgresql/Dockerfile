FROM postgres:14.1-alpine

COPY ./conf/createdb.sql /docker-entrypoint-initdb.d/
COPY ./conf/pg_hba.conf /etc/postgresql/
#COPY ./conf/postgresql.conf /etc/postgresql/
EXPOSE 5432

CMD ["postgres"]
#, "-c", "config_file=/etc/postgresql/postgresql.conf"