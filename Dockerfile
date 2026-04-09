FROM node:20 AS build

WORKDIR /app

ARG REACT_APP_API_URL=
ARG REACT_APP_BACKEND_URL=
# Ensure Docker build doesn't bake Railway/Netlify URLs by default.
ENV REACT_APP_API_URL=${REACT_APP_API_URL} \
    REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL}

COPY package.json package-lock.json* yarn.lock* ./

# Prefer npm when package-lock exists
RUN if [ -f package-lock.json ]; then npm ci; else yarn install --frozen-lockfile; fi

COPY . .

RUN if [ -f package-lock.json ]; then npm run build; else yarn build; fi

FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

