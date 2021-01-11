export default {
    install(Vue, router) {
        var routes = [];
        var zeroIndex = undefined;

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
            /***
             * @param mode Mode of operation. -1 = push as root, 0 = replace, 1 = normal push
             */
            push(route, mode) {
                if (mode === undefined) {
                    mode = 1;
                }
                if (mode == -1) {
                    const i = routes.length - 1;
                    routes = [route];
                    if (i > 0) {
                        router.go(-i);
                    } else {
                        router.replace(route).catch((ignoredErr) => {});
                    }
                } else if (mode == 0) {
                    // Replace
                    routes.pop()
                    routes.push(route);
                    router.replace(route).catch((ignoredErr) => {});
                } else {
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
