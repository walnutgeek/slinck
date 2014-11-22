import os
from sniffer.api import *

@file_validator
def js_files(filename):
      return filename.endswith('.js') or filename.endswith('.yaml') or filename.endswith('.json')

@runnable
def execute_mocha(*args):
    import nose
    if 0 == os.system('cd mocha ; mocha .'):
       vars = { 's' : 'slinck.js',
                'd' : '~/Documents/workspace/OnTimer/ontimer/web' };
       os.system( 'rm -f {d}/{s}; cp app/{s} {d}/; chmod 444 {d}/{s}'.format(**vars) );
       return True
    return False

