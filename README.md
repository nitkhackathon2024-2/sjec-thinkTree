## St.Joseph Engineering College - ThinkTree

| Name                      | Phone number     |
| ------------------------- | ---------------- |
| Muhammad Saheed  (Leader) | +91 78924 13750  |
| Nithin                    | +91 7975093136   |
| Arshith Vaz               | +91 761 916 9300 |


## Problem Statement
3. Theme: Improving Work Efficiency
3.1 Problem Statement: Knowledge Distiller App

## Instructions on running your project
Setup pgvector
```
$ docker run -d --name pgvec -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e PGDATA=/var/lib/postgresql/data/pgdata -p 5432:5432 docker.io/pgvector/pgvector:pg17
```

Setup ollama
```
$ ollama serve
$ ollama pull llama3.2
$ ollama pull nomic-embed-text
```

Run nextjs
```
$ cd code/think-tree
$ cp .env.example .env
$ bun install
$ bunx drizzle-kit migrate
$ bun dev
```

Setup the python API
```
$ cd code/APIs
$ python -m venv .venv
$ source ./.venv/bin/activate
$ pip install -r requirements.txt
$ python -m uvicorn main:app --reload
```

Visit localhost:3000

## References
