FROM node:18-alpine

WORKDIR /app

# Install dependencies (including dev deps for local development)
COPY package*.json ./
RUN npm ci --silent

# Copy project files
COPY . ./

ENV PORT 3000
EXPOSE 3000

# Start dev server so the container is useful for local verification
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
