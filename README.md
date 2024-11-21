# Kneipenquiz 3000

The installation includes a console command with the name `kneipenquiz3000`.
This will enable you to run the project and access all the other features.

Just starting an instance becomes:
```
kneipenquiz3000 serve -q <QUIZ_FILE> -f -n <QUIZ_NAME> -P <MASTER_PASSWORD>
```

For information on flags on this particular command use:
```
kneipenquiz3000 serve -h
```

Or to show the full help and all subcommands enter:
```
kneipenquiz3000 -h
```


## Build package

Right now the build frontend is stored in `/src/kneipenquiz3000/frontend`.
This means that changing parts of the frontend requires the extra manual build step `npm run build` in `/frontend/`.
And then copy the files in `/frontend/build` over to `/src/kneipenquiz3000/frontend/`.
In future this might be automized by adding a custom build step.
