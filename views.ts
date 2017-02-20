import { ThingViewModel } from './app';

export var thingRow = {
    view: (vm: ThingViewModel) =>
        // row
        m('.row', <any>{ style: { display: 'flex', alignItems: 'center' } }, [
            // name
            m('.col-sm-2', [
                m('div', <any>{
                    class: 'progress progress-bar',
                    style: { width: Math.floor(vm.Progress.Get() * 500) / 10 + '%' },
                }),
                vm.DisplayText.Get()
            ]),
            // count
            m('.col-sm-2', [
                m(<any>'span', vm.Count.Get()),
                vm.CapacityShown.Get() ? m(<any>'span', ' / ') : '',
                vm.CapacityShown.Get() ? m(<any>'span', vm.Capacity.Get()) : '',
            ]),
            // button
            m('.col-sm-2', [
                m('button', <any>{
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