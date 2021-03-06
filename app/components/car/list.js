import m from 'mithril';
import API from '../../components/api';
import {Spinner, Button, Alert} from '../../components/ui';
import {MProduct, Order, Itemorder, Sesion} from './models';
import Modal from '../../containers/modal/modal';
import CarModalproduct from './modalproduct';
import IndicatorCar from './indicator';
import CoverageCar from './coverage';
import LoginCar from './login';
import {Config} from '../../config';

export const CarList = {
    vm(p){
        return {
            products: m.prop('empty'),
            working: m.prop(false),
            order: m.prop(new Order()),
            hasOrder: m.prop(false),
            fetchProducts: (skip = 0) => {
                return MProduct.listAvailablePaginate(skip);
            },
            openProduct(product,refOrder){
                return Modal.vm.open(CarModalproduct, {order:refOrder,
                    product: product, 
                    className: 'mmodal-small'
                });
            }
        };
    },
    controller(p){
        this.vm = CarList.vm(p);
        this.vm.working(true);
        this.hasSesion = m.prop('waiting');
        let skip = 0;

        this.refresh = () => {
            this.check();
        };

        this.urlMapsClient = () => {
            return Config.URL_MAPS_CLIENT;
        };

        this.addressClient = () => {
            return Config.ADDRESS_CIENT;
        };

        this.check = () => {
            Sesion.check().then(r => {
                this.hasSesion(Sesion.haveSesionClient());
                m.redraw();
            });
        };

        this.getProducts = () => {
            this.vm.fetchProducts(skip).then( r => {
                if(skip > 0)
                    this.vm.products(this.vm.products().concat(r));
                else
                    this.vm.products(r);

                skip += r.length;
            }).then(()=>this.vm.working(false)).then(()=>m.redraw());
        };

        this.getProducts();
    
        this.openProductWithCar = (product) => {
            this.vm.openProduct(product,this.vm.order.bind(this.vm));
        };

        this.amounproducts = () => {
                
                if(this.vm.products() != 'empty')
                    return this.vm.order().items_orders().length;   
                else
                    return 0;
        };

        this.scrollBottomEvent = () => {
            window.onscroll = null;
            window.onscroll = function(ev) {
                if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
                    console.log('onscroll event');
                    this.getProducts();
                }
            }.bind(this);
        };

        this.getNameUser = () => {
            let dataUser = ''; 
            try {
                dataUser = JSON.parse(localStorage.getItem('data_user')); 
            } catch (error) {}
            return dataUser.name;
        };

        this.scrollBottomEvent();

        this.sendOrder = () => {

            if (this.vm.order().jsonItemsOrders() == '[]') {
                Modal.vm.open(Alert, {label: 'Debe seleccionar al menos un producto'});
                return;
            }
            if (!Sesion.haveSesionClient()){
                Modal.vm.open(Alert, { label: 'La sesión ha sido cerrada recientemente, porfavor, vuelva a iniciarla' });
            } else {
                const currentformData = new FormData();
                let order = this.vm.order();
                currentformData.append('created_at', order.created_at());
                currentformData.append('items_orders', order.jsonItemsOrders());
                currentformData.append('delivery_type', order.form.delivery_type());
                currentformData.append('status', order.status());
                order.reloadUserId();
                currentformData.append('users_id', order.users_id());  
                const clientInfo = Sesion.getSesionObject();
                currentformData.append('cell_phone', clientInfo.cell_phone);
                currentformData.append('email', clientInfo.email);
                currentformData.append('neighborhood', clientInfo.neighborhood);
                currentformData.append('address', clientInfo.address);
                currentformData.append('name', Sesion.getNameUser());
                currentformData.append('userIdFacebook', Sesion.getSesionObject().authResponse.userID);

                Order.save(currentformData)
                .then(res => {
                    this.vm.working(false);
                    if(JSON.parse(res) == false){
                        Modal.vm.open(Alert, {label: 'No se pudo guardar la orden, porfavor vuelta a intentarlo'});
                    } else {  
                        this.vm.order(new Order());
                        this.vm.hasOrder(false);
                        Modal.vm.close();
                        Modal.vm.open(Alert, {label: 'Orden guardada con éxito', icon: 'pt-icon-endorsed', mood: 'success'});
                    }
                }).catch(erSave => {
                    this.vm.working(false);
                    Modal.vm.open(Alert, {label: 'No se pudo guardar la orden, por favor verifique datos faltantes, y/o reales'});
                });
            }
        };

        this.openShared = (idProduct) => {
            const link = MProduct.getUrlShareProductFacebook(idProduct); 
            const urlSharedFacebook = `https://www.facebook.com/sharer/sharer.php?u=${link}`;
            window.open(urlSharedFacebook, '_blank');
        };

        this.sharedWithFacebookV2 = (idProduct) => {
            return (
                <a onclick={this.openShared.bind(this, idProduct)} class="pt-tag pt-intent-primary"> 
                    <i class="fa fa-facebook-square" aria-hidden="true"></i>
                    <span class="sepcolor">_</span>
                    Compartir
                </a>
            ); 

        };
    },
    view(c,p){

        let indicator = <div class="align-indicator-car"><IndicatorCar refresh={c.refresh.bind(c)} hasOrder={c.vm.hasOrder.bind(c.vm)} sendOrder={c.sendOrder.bind(c)} order={c.vm.order.bind(c.vm)} amounproducts={c.amounproducts.bind(c)} /></div>;

        let messageStivensonContact = <div><br/><div class="message-stivenson-contact"><b>¿ Quieres tu sitio acá ? contactame con <a style="color: #213B6E;" href="mailto:stivenson.rpm@gmail.com">stivenson.rpm@gmail.com</a></b></div></div>; 

        let addressClient = <span class="address-client">{c.addressClient()}</span>;

        let coverage = <div class="align-coverage-car"><CoverageCar /></div>;

        let login = <div class="align-login-car"><LoginCar hasSesion={c.hasSesion.bind(c)} checkSesion={c.check.bind(c)} refresh={c.refresh.bind(c)} hasOrder={c.vm.hasOrder.bind(c.vm)} sendOrder={c.sendOrder.bind(c)} /></div>;

        let list = <div class="custom-spinner text-center"><Spinner Large warning /></div>;
 
        let infocar = (
            <div class="row infocar floating-header">
                <div class="col-sm-8 col-md-8 col-xs-12" >
                    <a style="color: #FFFFFF;" href={c.urlMapsClient()} target="_blank"><span class="pt-icon-standard pt-icon-map-marker custom-icon"></span>&nbsp;{c.addressClient()}</a>{messageStivensonContact}
                </div>
                <div class="col-sm-4 col-md-4 col-xs-12" >
                    <div class="row"><div class="col-md-4 col-xs-6"><br/>{coverage}</div><div class="col-md-3 col-xs-6"><br/>{indicator}</div><div class="col-md-5 col-xs-12"><br/>{login}</div></div>
                </div>
            </div>
        );

        if(c.vm.products() != 'empty'){
            list = (
                <div class="car-list">
                    {infocar}
                    <div class="row not-floating-body">
                        {c.vm.products().map((product) => {
                            return (
                                <div class="col-sm-3 col-md-3 col-xs-12 col-centered cont-thumbnail-custom">
                                    <a onclick={c.openProductWithCar.bind(c,product)} class="thumbnail thumbnail-click thumbnail-custom">
                                        <div class="cont-image-product">
                                            <img class="image-product" alt={"image product "+product.id()} src={product.srcImage()} />
                                        </div>
                                        <div class="caption text-center">
                                            <h4 class="title-product">{product.name()}</h4>
                                            <p class="price-product">{product.value()}</p>
                                        </div>
                                        {c.sharedWithFacebookV2(product.id())}
                                    </a>
                                </div> 
                            );
                        })}                                  
                    </div>
                </div>   
            );
        }

        return list;
    }
};


export default CarList;
