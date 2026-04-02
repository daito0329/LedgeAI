FROM ruby:3.2.2-slim

RUN apt-get update -qq && \
    apt-get install -y build-essential default-libmysqlclient-dev default-mysql-client git pkg-config && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY Gemfile Gemfile.lock ./
RUN bundle install

# Copying the rest is done by volume in docker-compose for dev
COPY . .

EXPOSE 3001
CMD ["bash", "-c", "rm -f tmp/pids/server.pid && bundle exec rails server -b '0.0.0.0' -p 3001"]
