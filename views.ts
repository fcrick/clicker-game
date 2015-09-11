/// <reference path="mithril.d.ts"/>
/// <reference path="app.ts"/>
/// <reference path="gamedata.ts"/>

var thingRow = {
    view: (vm: ThingViewModel) =>
        // row
        m('.row', { style: { display: 'flex', alignItems: 'center' } }, [
            // name
            m('.col-sm-2', [
                m('div', {
                    class: 'progress progress-bar',
                    style: { width: Math.floor(vm.Progress.Get() * 500) / 10 + '%' },
                }),
                vm.DisplayText.Get()
            ]),
            // count
            m('.col-sm-2', [
                m('span', vm.Count.Get()),
                vm.CapacityShown.Get() ? m('span', ' / ') : '',
                vm.CapacityShown.Get() ? m('span', vm.Capacity.Get()) : '',
            ]),
            // button
            m('.col-sm-2', [
                m('button', {
                    title: vm.ButtonTitle.Get(),
                    class: 'btn btn-primary',
                    disabled: !vm.ButtonEnabled.Get(),
                    onclick: vm.Buy,
                }, [
                    vm.ButtonText.Get(),
                ]),
            ]),
        ])
};