export default {
    install(Vue, router) {
        var routes = [];
        var zeroIndex = undefined;

        // window.addEventListener('popstate', () => {
        //     if (routes.length > 1) {
        //         routes.splice(routes.length - 1);
        //     }
        // });

        router.beforeResolve((to, ignoredfrom, next) => {
            if (!zeroIndex) {
                routes = [to];
                zeroIndex = window.history.length;
            }
            next();
        })

        router.beforeEach((to, from, next) => {
            const index = routes.findIndex((item) => {
                return item.path == to.path || item.name == to.name;
            });
            if (index < 0 && routes.length > 0) {
                next(routes[0]);
                return;
            }
            if (index >= 0) {
                routes.splice(index + 1);
            }
            next();
        })

        const navigationService = {
            push(route, asRoot) {
                asRoot = asRoot || false;
                //var resolved = router.resolve(route);
                //resolved.route.meta = route.meta || {};
                if (asRoot) {
                    const i = routes.length - 1; // window.history.length - zeroIndex;
                    routes = [route];
                    //resolved.route.meta.index = 0;
                    if (i > 0) {
                        router.go(-i);
                    } else {
                        router.replace(route).catch((ignoredErr) => {});
                    }
                } else {
                    //resolved.route.meta.index = routes.length;
                    routes.push(route);
                    router.push(route).catch((ignoredErr) => {});
                }
            },

            canPop() {
                return routes.length > 1;
            },

            pop() {
                router.go(-1);
            }
        }
        Vue.prototype.$navigation = navigationService;
    }
}
