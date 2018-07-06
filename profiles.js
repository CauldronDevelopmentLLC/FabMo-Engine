var config = require('./config')
var async = require('async')
var fs = require('fs-extra')
var log = require('./log').logger('profiles')
var ncp = require('ncp').ncp
var util = require('./util')

var PROFILE_DIRS = ['config','macros','apps']
var profiles = {}

var load = function(callback) {
	log.debug('Loading profiles...')
	var profileDir = config.getDataDir('profiles')
	fs.readdir( profileDir, function( err, files ) {
        if(err) {
        	return callback(err);
		}
		fs.readdir('./profiles', function(err, localfiles){
			if(err) {
				log.error(err);
			} else {
				localfiles = localfiles.filter(function(item){
					return !(/(^|\/)\.[^\/\.]/g).test(item)
				});
				for(var i =  0; i < localfiles.length; i++){
					if(files.indexOf(localfiles[i]) === -1){
							try {
							fs.copySync('./profiles/'+localfiles[i] , profileDir+'/'+localfiles[i]);
							files.push(localfiles[i]);
							log.info('Copied ' + localfiles[i]+ 'into opt');
							} catch(err){
								log.error(err);
							} 
							
					}
				}
			}
			util.diskSync(function() {
				async.each(files, function(file, callback) {
					try {
					var profilePath = path.join(profileDir, file);
					fs.stat(profilePath,function(err,stats){
						if(err) callback(err);
						if(stats.isDirectory()) {
							readProfileInfo(profilePath, function(err, profile) {
								try {
								if(err) {
									log.error(err);
								} else {
									log.debug('Read profile ' + profile.name);
									profiles[profile.name] = profile;
								}} catch(e) {
									log.error(e)
								}
								callback(null);
							});
						} else {
							callback(null);
						}
					});
				} catch(e) {
					log.error(e);
				}
				}, 
				function allDone() {
					callback(null, profiles);
				});
			});
		});
    });
}

var readProfileInfo = function(profileDir, callback) {
	fs.readFile(path.join(profileDir, 'package.json'), 'utf8', function (err, data) {
    	if (err) return callback(new Error('Could not read profile package.json: ' + err))
    	try {
    		var obj = JSON.parse(data);    		
    	} catch(e) {
    		return callback(new Error('Profile ' + profileDir + ' does not have a valid package.json'));
    	}
    	if(!obj['name']) throw new Error('Profile package.json does not have a name');
		callback(null, {
			name : obj['name'],
			description : obj['description'] || '',
			dir : profileDir
		});	
	});
}

var apply = function(profileName, callback) {
	// Make sure this is a profile that actually occurs in the list
	if(profileName in profiles) {
		log.debug('Switching profiles to ' + profileName)
		// Get the profile data
		profile = profiles[profileName];
		async.each(PROFILE_DIRS, function(dir, callback) {
			var configDir = config.getDataDir(dir)
			var profileConfigDir = path.join(profile.dir, dir)
			var authSecretExists = false;
			var authPath = configDir+'/auth_secret';

			log.debug('Removing config directory ' + configDir);
			//if auth_secret file exists lets copy it to a tmp directory
			if (fs.existsSync(authPath)) {
				authSecretExists = true;
				try {
					fs.ensureDirSync('/opt/fabmo/tmp');
					fs.copySync(authPath, '/opt/fabmo/tmp/auth_secret');
				} catch(e) {
					log.warn(e);
				}
			} else {
				log.debug('Auth secret doesnt already exist');
			}
			fs.remove(configDir, function(err) {
				if(err) {
					return callback(err);
				}
	
				// And replace with the configuration provided by the profile
				log.debug('Copying profile configuration directory ' + profileConfigDir);
				ncp(profileConfigDir, config.getDataDir(dir), function (err) {
					if (err) {
						return callback(err);
					} else {
						log.debug('...done copying.')
						///check to see if we copied an auth_secret
						if(authSecretExists) {
							fs.copySync('/opt/fabmo/tmp/auth_secret', authPath);
							fs.remove('/opt/fabmo/tmp' , function(err) {
								if(err){
									log.error(err);
								} else {
									log.debug('copied auth_secret and removed tmp dir')
								}

							})
						}
						callback();
					}
				});
			});
		},
		function allDone(err) {
			config.clearAppRoot(function(err) {
				appsDir = config.getDataDir('apps')
				fs.readdir(appsDir, function(err, files) {
					if(files ) {
						files.forEach(function(file) {
							fs.renameSync(path.join(appsDir, file), path.join(appsDir, util.createUniqueFilename(file)));
						});
						util.diskSync(function() {
							callback(null);
						});
					} else {
						util.diskSync(function() {
							callback(null, 'no apps');
						});
					}
				});
			});
		});		
	} else {
		callback(new Error(profiles + ' is not a valid profile.'))
	}
}

module.exports.load = load
module.exports.apply = apply
module.exports.getProfiles = function() {return profiles;}
