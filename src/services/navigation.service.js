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
            if (this.nextRoutes) {
                console.log("Nav: next routes set, going:", this.routes, this.nextRoutes);
                this.routes = this.nextRoutes;
                this.nextRoutes = null;
                if (this.routes.length > 0) {
                    console.log("Redirecting to", this.routes.lastItem());
                    next(this.routes.lastItem());
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
                    const i = routes.length - 1;
                    nextRoutes = [route];
                    if (i > 0) {
                        router.go(-i);
                    } else {
                        router.replace(route).catch((ignoredErr) => {});
                    }
                } else if (mode == 0) {
                    // Replace
                    nextRoutes = [...routes];
                    nextRoutes.pop();
                    nextRoutes.push(route);
                    router.replace(route).catch((ignoredErr) => {});
                } else {
                    nextRoutes = [...routes];
                    nextRoutes.push(route);
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
                nextRoutes = [...routes];
                nextRoutes.pop();
                router.go(-1);
            }
        }
        Vue.prototype.$navigation = navigationService;
    }
}
