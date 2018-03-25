clone the repository, then `cd` into it and run:

    meteor create .
    meteor add reactive-dict
    meteor npm install --save babel-runtime
	npm -g install fibers
    meteor add session

to launch, run:

    meteor

and navigate your browser to `localhost:3000`



to commit latest state to memory

	admin -> export
	
to revert to particular day

	admin -> query



misc
	
	mongodump -h 127.0.0.1 --port 3001 -d meteor
	mongorestore -h 127.0.0.1 --port 3001 -d meteor dump/meteor



