FROM hayd/alpine-deno:latest

EXPOSE 8000

WORKDIR /app

RUN deno --version > version.txt

USER deno

COPY ./project .

RUN deno cache deps.ts

CMD ["run", "--allow-net", "main.ts"]
