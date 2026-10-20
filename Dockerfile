FROM node:26
WORKDIR /app

# Install dependencies in the image (you can also skip this and install on run)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest (only used if you build the image with app sources inside)
COPY . .

# Expose the port (informative directive, still requires to map the port when running the container)
EXPOSE 3000

# Start the development server
CMD ["npm", "run", "dev"]