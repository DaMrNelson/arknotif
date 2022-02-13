:: ew, .bat
:: venv\scripts\activate
:: pip install -r requirements.txt
pyinstaller -w -F -n "ArkNotif" -i thumbs_up.ico --paths venv\lib\site-packages --add-data "web;web" --add-data "arknotif;arknotif" --add-data "flaskwebgui.py;flaskwebgui.py" arknotifstartup.py
