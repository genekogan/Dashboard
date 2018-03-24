import time
import os
import re
import pytz
from dateutil import parser
from datetime import datetime
import subprocess






root = '/Users/gene/NewDash/Dashboard'
backup_dir = 'admin/backup'


def export_db():
	cmd = 'cd %s ; ' % root
	
	cmd += 'mongoexport --host localhost --port 3001 --db meteor --collection events --out %s/events.json ; ' % backup_dir
	cmd += 'mongoexport --host localhost --port 3001 --db meteor --collection notes --out %s/notes.json ; ' % backup_dir
	cmd += 'mongoexport --host localhost --port 3001 --db meteor --collection lists --out %s/lists.json ; ' % backup_dir
	cmd += 'mongoexport --host localhost --port 3001 --db meteor --collection tags --out %s/tags.json ; ' % backup_dir
	cmd += 'mongoexport --host localhost --port 3001 --db meteor --collection travels --out %s/travels.json ; ' % backup_dir

	cmd += 'cd admin/backup ; '
	cmd += 'git add *.json ; '
	cmd = 'git commit -m "%s" ; ' % str(datetime.today())#time.strftime("%x")

	parse.parse(datetime.today())

	print(cmd)
	os.system(cmd)



def import_db(hash_string):
	cmd = 'cd %s ; '%root
	cmd += 'cd admin/backup ; '
	cmd += 'git checkout %s ; ' % hash_string

	print(cmd)
	os.system(cmd)

	cmd =  'mongoimport -h localhost:3001 --db meteor --collection events --drop --type json --file %s/events.json ; ' % backup_dir
	cmd += 'mongoimport -h localhost:3001 --db meteor --collection notes --drop --type json --file %s/notes.json ; ' % backup_dir
	cmd += 'mongoimport -h localhost:3001 --db meteor --collection lists --drop --type json --file %s/lists.json ; ' % backup_dir
	cmd += 'mongoimport -h localhost:3001 --db meteor --collection tags --drop --type json --file %s/tags.json ; ' % backup_dir
	cmd += 'mongoimport -h localhost:3001 --db meteor --collection travels --drop --type json --file %s/travels.json' % backup_dir

	print(cmd)
	os.system(cmd)

	cmd = 'cd admin/backup ; '
	cmd += 'git reset --hard HEAD'

	print(cmd)
	os.system(cmd)


def query_db(date_str):
	query_string = '%s 23:59:59 -1200' % date_str
	cmd = 'cd %s ; cd admin/backup ; git log'%root
	proc = subprocess.Popen([cmd], stdout=subprocess.PIPE, shell=True)
	out, err = proc.communicate()
	pattern = 'commit (.+)\nAuthor: (.+)+\nDate:   (.+)+'
	commits = re.findall(pattern, out)
	query = parser.parse(query_string)
	commits_before_query = [ c for c in commits if parser.parse(c[2])<=query]
	if len(commits_before_query) == 0:
		print("no commits before %s" % query_string)
		return
	query_commit = commits_before_query[0]
	commit_hash, author, date = query_commit
	import_db(commit_hash)



#date_str = '3/31/2018'
#query_db(date_str)


export_db()