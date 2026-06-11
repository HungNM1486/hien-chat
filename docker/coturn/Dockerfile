FROM coturn/coturn:4.6.2-alpine

COPY turnserver.conf.template /etc/coturn/turnserver.conf.template
COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["sh", "/entrypoint.sh"]
