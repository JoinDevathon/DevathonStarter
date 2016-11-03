#!/usr/bin/env bash

rm -rf ./RepoTemplate/
git clone "https://DevathonBot:$1@github.com/JoinDevathon/RepoTemplate.git"
cd RepoTemplate

git reset $(git commit-tree HEAD^{tree} -m "Initial Commit")

for ((i=2; i<=$#; i++)); do
    username=${!i}
    git remote add "$username" "https://DevathonBot:$1@github.com/JoinDevathon/$username-2016.git"
    git push "$username" master
done
