DIY organizational software: todo list, calendar, and notetaker in one. Work in progress, lots of bugs, but basically working.

	git clone https://github.com/genekogan/Dashboard
	cd Dashboard
    meteor create .
    meteor add reactive-dict
    meteor npm install --save babel-runtime
	npm -g install fibers
    meteor add session
	cd private/backup
	git init


to launch, go back to root directory and run:

    meteor

and navigate your browser to `localhost:3000`
