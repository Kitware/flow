/**
 * Administrative configuration view. Shows the global-level settings for this
 * plugin.
 */
girder.views.flow_ConfigView = girder.View.extend({
    events: {
        'submit #g-flow-settings-form': function (event) {
            event.preventDefault();
            this.$('#g-flow-settings-error-message').empty();

            this._saveSettings([{
                key: 'flow.full_access_users',
                value: this.$('#g-flow-full-access-users').val().trim()
            }, {
                key: 'flow.full_access_groups',
                value: this.$('#g-flow-full-access-groups').val().trim()
            }, {
                key: 'flow.safe_folders',
                value: this.$('#g-flow-safe-folders').val().trim()
            }, {
                key: 'flow.require_auth',
                value: this.$('#g-flow-require-auth').is(':checked')
            }]);
        }
    },

    initialize: function () {
        girder.restRequest({
            type: 'GET',
            path: 'system/setting',
            data: {
              list: JSON.stringify([
                  'flow.full_access_users',
                  'flow.full_access_groups',
                  'flow.safe_folders',
                  'flow.require_auth'
              ])
            }
        }).done(_.bind(function (resp) {
            this.render();
            this.$('#g-flow-full-access-users').val(JSON.stringify(
                resp['flow.full_access_users'] || []));
            this.$('#g-flow-full-access-groups').val(JSON.stringify(
                resp['flow.full_access_groups'] || []));
            this.$('#g-flow-safe-folders').val(JSON.stringify(
                resp['flow.safe_folders'] || []));
            this.$('#g-flow-require-auth').attr('checked',
                resp['flow.require_auth'] === false ? null : 'checked');
        }, this));
    },

    render: function () {
        this.$el.html(girder.templates.flow_config());

        if (!this.breadcrumb) {
            this.breadcrumb = new girder.views.PluginConfigBreadcrumbWidget({
                pluginName: 'Flow',
                el: this.$('.g-config-breadcrumb-container'),
                parentView: this
            });
        }

        this.breadcrumb.render();

        return this;
    },

    _saveSettings: function (settings) {
        girder.restRequest({
            type: 'PUT',
            path: 'system/setting',
            data: {
                list: JSON.stringify(settings)
            },
            error: null
        }).done(_.bind(function (resp) {
            girder.events.trigger('g:alert', {
                icon: 'ok',
                text: 'Settings saved.',
                type: 'success',
                timeout: 4000
            });
        }, this)).error(_.bind(function (resp) {
            this.$('#g-flow-settings-error-message').text(
                resp.responseJSON.message);
        }, this));
    }
});

girder.router.route('plugins/flow/config', 'flowCfg', function () {
    girder.events.trigger('g:navigateTo', girder.views.flow_ConfigView);
});

girder.exposePluginConfig('flow', 'plugins/flow/config');
