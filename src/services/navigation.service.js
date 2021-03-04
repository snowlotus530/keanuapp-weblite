export default {
    install(Vue, router) {
        var routes = [];
        var nextRoutes = null;
        var zeroIndex = undefined;

        router.beforeResolve((to, ignoredfrom, next) => {
            if (!zeroIndex) {
                routes = [to];
                zeroIndex = window.history.length;
            }
            next();
        })

        router.beforeEach((to, from, next) => {
            if (nextRoutes) {
                console.log("Nav: next routes set, going:", routes, nextRoutes);
                routes = nextRoutes;
                nextRoutes = null;
                if (routes.length > 0) {
                    console.log("Redirecting to", routes[routes.length - 1]);
                    next(routes[routes.length - 1]);
                    return;
                }
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
                    nextRoutes = [route];
                } else if (mode == 0) {
                    // Replace
                    nextRoutes = [...routes];
                    nextRoutes.pop();
                    nextRoutes.push(route);
                } else {
                    nextRoutes = [...routes];
                    nextRoutes.push(route);
                }

                const index = nextRoutes.length - routes.length;
                const targetIndex = nextRoutes.length - 1;
                console.log("Nav - index " + index + " Target " + targetIndex);
                if (index < 0) {
                    console.log("Nav - go " + index);
                    router.go(index);
                } else if (index == 0) {
                    console.log("Nav - replace");
                    routes = nextRoutes;
                    nextRoutes = null;
                    router.replace(route).catch((ignoredErr) => {});
                } else {
                    console.log("Nav - push");
                    router.push(route).catch((ignoredErr) => {});
                }
            },

            canPop() {
                if (nextRoutes) {
                    return nextRoutes.length > 1;
                }
                return routes.length > 1;
            },

            pop() {
                routes.pop();
                router.go(-1);
            }
        }
        Vue.prototype.$navigation = navigationService;
    }
}
