FROM node
WORKDIR /var/www/server/
COPY package*.json ./
RUN npm install
RUN npm i -g nodemon 
COPY . .
EXPOSE 3000
CMD nodemon index.js 
# && nodemon checkoutConsumer.js
# ADD start.sh /
# RUN chmod +x /start.sh
# CMD ["/start.sh"]
