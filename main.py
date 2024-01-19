import tornado.ioloop
import tornado.web
import tornado.websocket
import win32security
import threading
import win32con
import mmap
import os
settings = {
    "template_path": os.path.join(os.path.dirname(__file__), "templates"),
    "static_path": os.path.join(os.path.dirname(__file__), "static"),
}

key1 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
key2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

class WSHandler(tornado.websocket.WebSocketHandler):
    global key1
    clients = set()
    
    def open(self):
        print("1 WebSocket connection opened")
        WSHandler.clients.add(self)

    def on_message(self, message):
        global key1
        if message == "alive?":
            # 处理"alive?"消息
            self.write_message("alive")
        else:
            # 处理其他消息
            # 在这里执行 updateLed() 函数或其他逻辑
            key1 = list(map(int,message[1:]))
            keycallback()
            
            # print(f"1 {key1}")

    def on_close(self):
        print("1 WebSocket connection closed")
        WSHandler.clients.remove(self)
    
    @classmethod
    def send(cls, message):
        for client in cls.clients:
            client.write_message(message)
        
class WS2Handler(tornado.websocket.WebSocketHandler):
    global key2
    clients = set()
    
    def open(self):
        print("2 WebSocket connection opened")
        WS2Handler.clients.add(self)

    def on_message(self, message):
        global key2
        if message == "alive?":
            # 处理"alive?"消息
            self.write_message("alive")
        else:
            key2 = list(map(int,message[1:]))
            keycallback()
            # print(f"1 {key2}")

    def on_close(self):
        print("2 WebSocket connection closed")
        WS2Handler.clients.remove(self)
    
    @classmethod
    def send(cls, message):
        for client in cls.clients:
            client.write_message(message)

def keycallback():
    # if nowkey1 != key1 or nowkey2 != key2:
    #merge key1 and key2 and use or 
    
    key = key1[:16] + key2[:16]
    
    key = key[::-1]
    
    print(''.join(map(str,key)))
    key = list(map(lambda x:bytes([128 if x else 0]),key))
    
    shared_buffer_accessor.seek(6)
    shared_buffer_accessor.write(b''.join(key[0:37]))
    
    


        

class MainHandler(tornado.web.RequestHandler):
    #index.html and config.js and src.js and app.css
    def get(self):
        self.render("index.html")
        
class Main2Handler(tornado.web.RequestHandler):
    #index.html and config.js and src.js and app.css
    
    def get(self):
        self.render("index2.html")

def make_app():
    return tornado.web.Application([
        (r"/1", MainHandler),
        (r"/2", Main2Handler),
        (r"/ws", WSHandler),
        (r"/ws2", WS2Handler),
        
        (r'/favicon.ico', tornado.web.StaticFileHandler, dict(path=settings['static_path']))
    ],**settings,debug=True,)


abovergbled = [0] * 32 * 3
    
def update_data():
    global abovergbled
    if (abovergbled != list(shared_buffer_accessor[6 + 32:6 + 32 + 32 * 3]) or True):
        
        abovergbled = list(shared_buffer_accessor[6 + 32:6 + 32 + 32 * 3]).copy()
        
        data1 = shared_buffer_accessor[6 + 32:6 + 32 + 16 * 3]
        WS2Handler.send(','.join(map(str,data1)))
        
        data2 = shared_buffer_accessor[6 + 32 + 16 * 3:6 + 32 + 32 * 3]
        # data2 = data2[0:3] * 2 + data2[3:6] * 2 + data2[6:9] * 2 + data2[9:12] * 2 + data2[12:15] * 2 + data2[15:18] * 2
        WSHandler.send(','.join(map(str,data2)))
        
        
if __name__ == "__main__":
    custom_security = win32security.SECURITY_ATTRIBUTES()
    custom_security.bInheritHandle = True
    
    sid = win32security.CreateWellKnownSid(win32security.WinWorldSid)
    custom_security.SECURITY_DESCRIPTOR.SetSecurityDescriptorOwner(sid, False)
    custom_security.SECURITY_DESCRIPTOR.SetSecurityDescriptorGroup(sid, False)
    custom_security.SECURITY_DESCRIPTOR.SetSecurityDescriptorDacl(True, None, False)
    
    
    shared_buffer = mmap.mmap(0, 1024, "Local\\BROKENITHM_SHARED_BUFFER", mmap.ACCESS_WRITE)
    shared_buffer_accessor = shared_buffer
    
    _init = True
    
    app = make_app()
    app.listen(8888)

    try :
        client_callback = tornado.ioloop.PeriodicCallback(update_data, 1000)
        client_callback.start()
        tornado.ioloop.IOLoop.current().start()
    except KeyboardInterrupt:
        isexiting = True