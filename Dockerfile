FROM node:18

WORKDIR /app

# התקנת תלויות
COPY backend/package*.json ./ 
RUN npm install

# העתקת קבצי הפרויקט
COPY backend/ .

# בניית TypeScript ל-JS
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
