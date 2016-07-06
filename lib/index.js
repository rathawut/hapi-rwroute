/**
 * Created by rathawut on 5/27/16.
 */
const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

const hapiRoute = {
  register: function register(server, options, next) {
    const routeExtnames = options.routeExtnames || ['.js'];
    const absRoutesDirPath = path.join(process.cwd(), options.routesDir || 'route');
    const indexFilename = 'index';

    function fn(absCurrentDirPath) {
      const items = fs.readdirSync(absCurrentDirPath);
      items.forEach((itemName) => {
        const absItemPath = path.join(absCurrentDirPath, itemName);
        if (fs.lstatSync(absItemPath).isDirectory()) { // Recursive
          fn(absItemPath);
          return;
        }
        const itemExtname = path.extname(absItemPath);
        const itemExtnameIndex = routeExtnames.indexOf(itemExtname);
        if (itemExtnameIndex !== 0) { // Skip non-route-extnames files
          return;
        }
        let routePath = absItemPath.substring(
          absRoutesDirPath.length, absItemPath.length - routeExtnames[itemExtnameIndex].length
        );
        if (routePath.endsWith(`/${indexFilename}`)) {
          routePath = routePath.substring(0, routePath.length - indexFilename.length - 1);
        }
        let routesConfig = require(absItemPath);
        if (!Array.isArray(routesConfig)) {
          routesConfig = [routesConfig];
        }
        for (let i = 0; i < routesConfig.length; i++) {
          if (!routesConfig[i].path) { // Override path
            routesConfig[i].path = routePath;
          }
          if (routesConfig[i].pathSuffix) { // Add path suffix
            routesConfig[i].path += routesConfig[i].pathSuffix;
          }
          delete routesConfig[i].pathSuffix;
        }
        server.route(routesConfig);
      });
    }

    fn(absRoutesDirPath);
    next();
  },
};

hapiRoute.register.attributes = {
  pkg,
};

module.exports = hapiRoute;
