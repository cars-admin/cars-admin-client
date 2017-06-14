import m from 'mithril';
import { Order, Client, Product, Itemorder, STATUTES, DELIVERY_TYPES } from './models';
import API from '../api';
import Modal from '../../containers/modal/modal';
import {Spinner, Button, Alert, Confirm} from '../../components/ui';
import Utils from '../utils';
import AdminModalproduct from './modalproduct';

export const Orders = {
    vm(p){
    	return {
            working: m.prop(false),
            orders: m.prop('empty'),
            clients: m.prop('empty'),
            products: m.prop('empty'),
            delivery_types: m.prop(DELIVERY_TYPES), 
            statutes: m.prop(STATUTES),
            readonly: m.prop(false),
            order: m.prop(new Order()),
            waitForm: m.prop(false)
        } 
    },
    controller(p){
        this.vm = Orders.vm(p);
        this.limitSizeImagen = 8388606;
        var currentformData = new FormData();

        let getOrders = (selectFirst,index) => {
            index = index || null;
            this.vm.working(true);
            Order.list()
                .then(this.vm.orders)
                .then(()=>this.vm.working(false))
                .then(()=>{
                    if(index != null){
                        if(index == 'first')
                            index = 0;
                        this.edit(index);
                }})
                .then(()=>{if(selectFirst == true) {this.edit(0)}})
                .then(()=>m.redraw());
        }

        getOrders(true,null);

        let getClients = () => {
            this.vm.working(true);
            Client.list(true)
                .then(this.vm.clients)
                .then(() => this.vm.working(false))
                .then(() => m.redraw());
        }

        this.nameUser = (clients_id) => {
            console.log(clients_id);
            if(clients_id != false){    
                let arr = this.vm.clients().filter(c => c.id() == clients_id);
                if(arr.length < 1)
                    return ' -- ';
                return arr[0].name()+' - '+arr[0].cc(); 
            }else{
                return '--';    
            }
            
        } 

        getClients();

        let getProducts = () => {
            this.vm.working(true);
            Product.list(true)
                .then(this.vm.products)
                .then(() => {
                    let arrProducts = this.vm.products();
                    for(let indexp in arrProducts){
                        arrProducts[indexp].selected(this.vm.order().isChecked(arrProducts[indexp].id()));
                    }
                })
                .then(() => this.vm.working(false))
                .then(() => m.redraw());
        }

        getProducts();

        this.add = () => {
            currentformData = new FormData();
            this.vm.waitForm(true);
            this.vm.order(new Order());
            this.vm.readonly(false);

            setTimeout(() => {
                this.vm.waitForm(false);
                m.redraw();
            },350);
        }

        this.edit = (index) => {
            currentformData = new FormData();
            this.vm.waitForm(true);
            let arrOrders = this.vm.orders();
            this.vm.order(arrOrders[index]);
            this.vm.order().index = m.prop(index+1);
            this.vm.readonly(false);

            setTimeout(() => {              
                this.vm.waitForm(false);
                m.redraw();
            },350);
        }

        this.detail = (index) => {
            this.vm.waitForm(true);
            let arrOrders = this.vm.orders();
            this.vm.order(arrOrders[index]);
            this.vm.readonly(true);
            setTimeout(() => {
                this.vm.waitForm(false);
                m.redraw();
            },350);
        }

        this.openProduct = (product) => {
            return Modal.vm.open(AdminModalproduct, {product: product, className: 'mmodal-small'});
        }

        this.delete = (index) => {
            let arrOrders = this.vm.orders();
            Modal.vm.open(Confirm, {className: 'mmodal-small', mood: 'success', icon: 'ok-circle',label: '¿Confirmas que deseas borrar esta orden?', actionLabel: 'Eliminar orden'})
            .then(() => {
                    Order.delete(arrOrders[index].id())
                    .then(res =>{
                        if(res == false){
                            Modal.vm.open(Alert, {label: 'No se pudo eliminar la orden'});
                        }else{  
                            getOrders(true,null);
                            Modal.vm.open(Alert, {label: 'Orden eliminada con éxito', icon: 'pt-icon-endorsed',mood: 'success'});
                        }
                    })
                }
            );

        }


        this.statusProduct = (products_id) => {
            let selected = this.vm.order().items_orders().filter(o => o.products_id() == products_id);
            let arrItems = this.vm.order().items_orders();
            if(selected.length > 0){
                delete arrItems[selected[0].id()];
                this.vm.order().items_orders(Utils.deleteNulls(this.vm.order().items_orders()));
            }else{
                // open modal
                let currentProducts = this.vm.products().filter(p => p.id() == products_id);
                this.openProduct(currentProducts[0]);
                // capture data in itemorder
                let itemorder = {
                    products_id: products_id
                }
                this.vm.order().items_orders().push(new Itemorder(itemorder));
            }
        }


        this.save = (event) => {
            if (event) { event.preventDefault(); }
            if (this.vm.working()) return;

            let endpoint = 'orders';
            let options = {
                serialize: (value) => value,
                url: API.requestUrl(endpoint)
            };

            currentformData.append('created_at', this.vm.order().form.created_at());

            if(this.vm.order().form.id() != false){

                // validation for make - less image

                currentformData.append('id', this.vm.order().form.id());
                this.vm.working(true);
                Order.save(currentformData,options)
                .then(res => {
                    this.vm.working(false);
                    if(res == false){
                        Modal.vm.open(Alert, {label: 'No se pudo actualizar la orden'});
                    }else{  
                        let auxIndex = (this.vm.order().index()-1) == 0 ? 'first': this.vm.order().index()-1;
                        getOrders(false,auxIndex);
                        Modal.vm.open(Alert, {label: 'Orden actualizada con éxito', icon: 'pt-icon-endorsed',mood: 'success'});
                    }   
                }).catch(erSave => {
                    this.vm.working(false);
                    console.log("Error: "+erSave);
                    Modal.vm.open(Alert, {label: 'No se pudo actualizar la orden, por favor verifique datos faltantes, y/o reales'});
                });

            }else{

                // validation for make
                this.vm.working(true);
                Order.save(currentformData,options)
                .then(res => {
                    this.vm.working(false);
                    if(res == false){
                        Modal.vm.open(Alert, {label: 'No se pudo guardar la orden'});
                    }else{  
                        this.vm.order(new Order());
                        currentformData = new FormData();
                        getOrders(true,null);
                        Modal.vm.open(Alert, {label: 'Orden guardada con éxito', icon: 'pt-icon-endorsed',mood: 'success'});
                    }
                }).catch(erSave => {
                    this.vm.working(false);
                    console.log("Error: "+erSave);
                    Modal.vm.open(Alert, {label: 'No se pudo guardar la orden, por favor verifique datos faltantes, y/o reales'});
                });

            }


        }


    },
    view(c,p){

        let spinner = <div class="custom-spinner text-center"><Spinner Large /></div>;
        let smallSpinner = <div class="text-center"><Spinner small /></div>;

        let list = spinner;
        let form = spinner;
        let selectUsers = smallSpinner;

        let btnAdd = <button onclick={c.add.bind(c)} type="button" class="pt-button pt-minimal pt-icon-add pt-intent-primary custom-add-btn" >Agregar Orden</button>;

        if(c.vm.clients() != 'empty'){
            selectUsers = ( 
                <label class="pt-label">
                    Usuario
                    <div class="pt-select">
                        <select name="users_id" onchange={m.withAttr('value', (v) => c.vm.order().form.users_id(v))} required>
                            {c.vm.clients().map((s) => {
                                return (
                                    <option value={s.id()} selected={c.vm.order().form.users_id() == s.id()}>{s.name()} - {s.cc()}</option>
                                )
                            })}
                        </select>
                    </div>
                </label>
            )
        }

        let panelProducts = (
            <div class="panel-body text-center">
                <i class="fa fa-cog fa-spin fa-3x fa-fw"></i>
            </div>
        )

        if(c.vm.products() != 'empty'){
            panelProducts = (
                <ul>
                    {c.vm.products().map((p) => {   
                        return (
                            <li>
                                <label class="pt-control pt-switch">
                                    <input name="products" type="checkbox" onchange={c.statusProduct.bind(c, p.id())} />
                                    <span class="pt-control-indicator"></span>
                                    {p.name()} - {p.value()}
                                </label>
                            </li>
                        )
                    })}    
                </ul>
            )
        }


        if(c.vm.waitForm() == false){
            form = (
            <div class="panel panel-default">
            <div class="panel-body">
                <form onsubmit={c.save.bind(c)} >
                    {selectUsers}
                    <div class="panel panel-default">
                        <div class="scroll-vertical">
                            {panelProducts}
                        </div>
                    </div>
                    <label class="pt-label">
                        Entrega
                        <div class="pt-select">
                            <select name="delivery_type" onchange={m.withAttr('value', (v) => {if(v != null) c.vm.order().form.delivery_type(v)})} required>
                                {c.vm.delivery_types().map((s) => {
                                    return (
                                        <option value={s.id} selected={c.vm.order().form.delivery_type() == s.id}>{s.name}</option>
                                    )
                                })}
                            </select>
                        </div>
                    </label>
                    <label class="pt-label">
                        Estado
                        <div class="pt-select">
                            <select name="status" onchange={m.withAttr('value', (v) => {if(v != null) c.vm.order().form.status(v)})} required>
                                {c.vm.statutes().map((s) => {
                                    return (
                                        <option value={s.id} selected={c.vm.order().form.status() == s.id}>{s.name}</option>
                                    )
                                })}
                            </select>
                        </div>
                    </label>
                    <div class={"text-center "+(c.vm.readonly() ? 'hidden':'')}>
                        <Button disabled="true" type="submit" loading={c.vm.working()} >
                            Guardar
                        </Button>
                    </div>
                </form>
            </div>
            </div>
            );
        }

        if(c.vm.orders() != 'empty' && c.vm.clients() != 'empty'){
            list = (
            	<div class="table-responsive custom-table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Estado</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                        {c.vm.orders().map((order,index) => {
                            return (
                                <tr>
                                    <td>{order.created_at()}</td>
                                    <td>{c.nameUser(order.users_id())}</td>
                                    <td><span class={"pt-tag pt-large pt-round "+order.styleStatus()}>{order.objStatus().name}</span></td>
                                    <td>
                                    {(() => {

                                        //switch
                                        /*if(order.status() == true){
                                            return <span class="pt-tag pt-intent-success">Disponible</span>;
                                        }else{
                                            return <span class="pt-tag ">No disponible</span>;
                                        }*/

                                    })()}
                                    </td>
                                    <td>
                                        <div class="dropdown">
                                          <button class="pt-button pt-minimal dropdown-toggle" type="button" data-toggle="dropdown"> Acciones
                                          <span class="caret"></span></button>
                                          <ul class="dropdown-menu">
                                            <li><button onclick={c.detail.bind(c,index)} type="button" class="pt-button pt-minimal pt-icon-search pt-intent-primary" >Detallar</button></li>
                                            <li><button onclick={c.edit.bind(c,index)} type="button" class="pt-button pt-minimal pt-icon-edit pt-intent-primary" >Editar</button></li>
                                            <li><button onclick={c.delete.bind(c,index)}  type="button" class="pt-button pt-minimal pt-icon-delete pt-intent-primary" >Borrar</button></li>
                                          </ul>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
            	</div>
            );
        }


        let content = (
            <div class="admin-orders row">
                <div clas="col-md-12">{btnAdd}<br/></div> 

                <div class="col-md-8">
                    {list}
                </div> 
                <div class="col-md-4">   
                    {form}
                </div> 
            </div>
        )

        return content;

    }
}


export default Orders;
