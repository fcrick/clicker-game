import { ThingViewModel } from './app';

export var thingRow = {
    view: (vm: ThingViewModel) =>
        // row
        m('.row', <any>{ style: { display: 'flex', alignItems: 'center' } }, [
            // name
            m('.col-sm-2', [
                m('div', <any>{
                    class: 'progress progress-bar',
                    style: { width: Math.floor(vm.Progress() * 500) / 10 + '%' },
                }),
                vm.DisplayText()
            ]),
            // count
            m('.col-sm-2', [
                m(<any>'span', vm.Count()),
                vm.CapacityShown() ? m(<any>'span', ' / ') : '',
                vm.CapacityShown() ? m(<any>'span', vm.Capacity()) : '',
            ]),
            // button
            m('.col-sm-2', [
                m('button', <any>{
                    title: vm.ButtonTitle(),

                    class: 'btn btn-primary',
                    disabled: !vm.ButtonEnabled(),
                    onclick: vm.Buy,
                }, [
                    vm.ButtonText(),
                ]),
            ]),
        ])
};