# DENO NETWORK ID

## GET STARED

 - ### PREREQUIS
     - avoir installé DENO
     - un serveur mysql
     - un client mysql
     - un terminal
    
 - ### INSTALLATION
   - #### SANS DOCKER
     1. Générer un fichier .env
       
            deno run --allow-read --allow-write --unstable ./project/cmd.ts make:env {\"ENV_VAR1\":\"ENV_VALUE1\", ...}
     2. Migrer la base de donnés
    
            deno run --allow-env --allow-net --unstable ./project/cmd.ts db:migrate
     3. Lancer le serveur
        
            deno run --allow-env --allow-net --allow-read --unstable ./project/main.ts
    
   - #### AVEC DOCKER
     - sur linux/mac

           sh docker-build.sh <comtainer-name>
     - sur windows
     
           docker-compose build
           docker-compose up <container-name>

## ANNEXES

- [DENO](https://deno.land/)
    - [Mysql connector](https://deno.land/x/mysql@v2.6.0)
    - [Oak backend framework](https://deno.land/x/oak@v6.3.1)
    - [Webview](https://deno.land/x/webview@0.4.7)
    - [Tutorials](https://denotutorials.net)
    - [Portage de commander.js](https://deno.land/x/cmd@v1.2.0)
    - [Librairie pour ajouter de la couleurs à ses messages console](https://deno.land/std@0.74.0/fmt/colors.ts)
- [TypeScript Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
<br />
<br />
