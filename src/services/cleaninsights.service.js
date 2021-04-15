import { CleanInsights, ConsentRequestUi } from 'clean-insights-sdk';
import config from "../assets/config";

export default {
    install(Vue) {

        class RequestUi extends ConsentRequestUi {
            showForCampaign(campaignId, campaign, complete) {
                const period = campaign.nextTotalMeasurementPeriod        
                if (!period) {
                    return ''
                }
                let message = 'Help us improve!\n\n'
                    + `We would like to collect anonymous usage data between ${period.start.format('LLL')} and ${period.end.format('LLL')} to improve the quality of the product.\n\nYour help would be highly appreciated.`

                complete(window.confirm(message))
                return ''
            }
        }

        const cleanInsightsService = new Vue({
            data() {
                return {
                    ci: null,
                    campaignId: null,
                    requestUi: null,
                }
            },
            created() {
                const analytics = config.analytics || {};
                if (analytics.enabled && analytics.config) {
                    this.ci = new CleanInsights(analytics.config);

                    // Get name of first campaign in the config.
                    this.campaignId = Object.keys(analytics.config.campaigns || { invalid: {} })[0];
                }
            },
            methods: {
                event(category, action) {
                    if (!this.ci) {
                        return;
                    }
                    if (!this.requestUi) {
                        this.requestUi = new RequestUi();
                    }
                    this.ci.requestConsentForCampaign(this.campaignId, this.requestUi, (granted) => {
                        if (!granted) {
                            return
                        }
                        this.ci.measureEvent(category, action, this.campaignId);
                    })
                }
            }
        });
        Vue.prototype.$ci = cleanInsightsService;
    }
}
