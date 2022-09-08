# Instructions

- git clone https://github.com/christopherjnelson/Arcadyan-5G-Web-Admin.git
- cd Arcadyan-5G-Web-Admin
- npm install
- npm start

# Overview:

This project started as a simple way to monitor the advanced cell metrics provided by the Arcadyan KVD21 and per usual, ballooned into an full fledged Web Admin for the device. I used a packet sniffer to monitor the HTTP requests the T-Mobile Home Internet App transmits and then did my best to re-produce the Mobile App's functionality. ~~Using nmap, I was able to deduce that the Gateway is running a custom version of OpenWRT~~ (According to [this user](https://github.com/chainofexecution/Arcadyan-KVD21), the gateway is running Android) but without SSH enabled, there isnt much more we can do outside of the functionality available via the currently exposed API's I've discovered (see below). Any attempts to discover new endpoints via brute force have been unsuccessful.

_Note:_ VPN's must be disabled in order to connect to the gateway via the webapp.

# Upcoming Functionality:

- Add New WiFi Network
- Ban/Delete Client from Network
- Display metric rating in Signal Popover
- Historic Cell Metric Data

# Discovered API Endpoints

- /TMI/v1/network/telemetry?get=clients
- /TMI/v1/network/telemetry?get=sim
- /TMI/v1/network/telemetry?get=cell
- /TMI/v1/auth/admin/reset
- /TMI/v1/auth/refresh
- /TMI/v1/auth/login
- /TMI/v1/profile/schedules
- /TMI/v1/version
- /TMI/v1/setup/onboard
- /TMI/v1/gateway/reset?set=reboot
- /TMI/v1/gateway/get=all
- /TMI/v1/network/configuration/v2?get=ap
- /TMI/v1/network/configuration/v2?set=ap
- /auth.fcgi
- /login_app.cgi?chk

# Open Ports

- 53/TCP open domain Cloudflare public DNS
- 80/TCP open http lighthttpd 1.4.59
- 3517/TCP open 802-11-iapp?
- 8080/TCP open http-proxy

# Screenshots

![Login](https://i.imgur.com/GT9LDjg.png)
![Signal](https://i.imgur.com/v1LEESq.png)
![WiFi](https://i.imgur.com/WvnkZ8x.png)
![Wifi Editing](https://i.imgur.com/3Xmo6qM.png)
![System](https://i.imgur.com/38k7f1E.png)
![System Clients](https://i.imgur.com/BxpQ2Lu.jpg)
