---
layout: post
title:  angular体验
category: Hello Code
---

上次学着用react写了一个url收藏简单功能。这次照着这个需求，用`angular1`来实践一下。  

先列一下需求：  
- 一个表单（添加新链接）  
- 一个列表（展示已存链接）  
- 一个链接类型列表（展示已有的链接类型）

与`react`基本`dom`都在`jsx`代码体现不同，`angular`要结合模板和`js`；  

可以先定义好基本dom：
{%highlight html%}
<div class="url-box" ng-controller="ubCtrl">
                <div class="add-form">
                <div class="form-line">
                    <label for="url_input">URL&ensp;:</label>
                    <input type="text" id="url_input"  placeholder="请输入url">
                </div>
                <div class="form-line">
                    <label for="desc_input">描述:</label>
                    <input type="text" id="desc_input"  placeholder="请输入描述">
                </div>
                <div class="form-line">
                    <div class="styled-select blue semi-square">
                        <select id="type_input" >
                        </select>
                    </div>
                </div>
                <div class="form-line" >
                    <label for="new_type_input">类型:</label>
                    <input type="text" id="new_type_input"  placeholder="请输入新类型">
                </div>
                <button class="btn" >提交</button>
            </div>
            <div class="all-list">
                <div class="list-type">
                    <a class="type-item" ></a>
                </div>
                <div class="list">
                    <p class="item" >
                        <a href=""></a>
                        <a class="close">删除</a>
                    </p>
                </div>
            </div>
        </div>

{%endhighlight%}
忘了，没说明一下项目结构：但其实也很简单

-lib angular.js

-js index.js

-index.html

angular1用的js既非es6，也不需要jsx编译，所以页面直接引用就好了。

页面用到的数据方面，我沿用react实践时的数据

angular的概念了，基本是module跟control，考虑到表单跟列表直接有交互，而多个control之间交互可能比较复杂，于是我采取一个control来实现，事实上内容也很简单。

整个部分里面，应当数链接类型列表最为简单，先看它怎么实现的：

首先是模板，应该是接受一个变量数组的数据，然后对照到模板，遍历输出对应的dom，其次是点击每个类型，要有一个触发url列表数据的变动展示（这个等说到列表的时候再一并说明）

说到遍历数组，首先想到的应该是ngRepeat指令了，其语法如下：
{%highlight html%}
<div ng-repeat="item in list">{{item}}</div>

{%endhighlight%}
基本可以从代码语义上分析出，这个模板会根据变量list输出所有的div来。

那模仿一下这次实现类型列表的模板如下：
{%highlight html%}
<div class="list-type">
    <a class="type-item" ng-repeat="type in types" ng-class="{active:currentType==type}"  ng-click="showList(type)">{{type}}</a>
</div>

{%endhighlight%}
假设，我们在js那边设定好了$scope的types变量存储的是url的类型数组，那这里就是类似于：
{%highlight javascript%}
for(var i=0;i<types.length;i++){
    //伪代码
    <a class="xxx">types[i]</a>
}

{%endhighlight%}
再者，我们看到这里有个`ngClass`指令，这个指令的用法是设定一个根据判断来决定是否添加给当前`dom`的`class`
比如这里的代码，意为根据`currentType==type`来决定当前dom是否要设置`active`这个`class`，其实就是给展示当前选中的类型。

而`ngClick`指令，则是设置了当前dom的一个点击事件触发，当dom被点击时，会调用`$scope.showList(type);` 这里的`type`不再需要加`{{}}`;

我们再看一下js那边怎么写对应的逻辑：
{%highlight javascript%}
var app = angular.module('ubApp', []);

app.controller('ubCtrl', function($scope){
//刷新类型列表数据和当前选中类型
    var refreshTypes = function(){
        $scope.types = gData.getTypeList();
        $scope.types2Select = $scope.types.map(function(e,i){
            var typeObj = {};
            typeObj['label'] = e;
            typeObj['key'] = e;
            return typeObj;
        }).concat({
            label:'新增类型',
            key:'add-new'
        });
        $scope.currentType = '';
    };

    $scope.showList = function(type){
        $scope.currentType = type;
        $scope.list = gData.getByType(type);
        if($scope.list.length==0){
            refreshTypes();
        }
    };

    
});


{%endhighlight%}
【这次的逻辑基本是在`ubCtrl`里面实现的了，后面写的`$scope`我就不写出来多余了。】

可以看到showList的实现：

`currentType`变量设置为对应的`type`，list变量则获取对应type的url列表，后面的判断是为了当选择的类型没有数据的时候，则刷新数据（这是在写的过程中遇到的逻辑问题处理。）

可以看到js的处理也很简单。

再来看列表的模板：
{%highlight html%}
<div class="list">
    <p class="item" ng-repeat="item in list">
        <a href="{{item.link}}">{{item.desc}}</a>
        <a class="close" ng-click="deleteItem(item.id)">删除</a>
    </p>
</div>

{%endhighlight%}
没有特殊的逻辑，跟类型列表一样，遍历list变量，展示信息，这里我们看点击删除的操作：
{%highlight javascript%}
$scope.deleteItem = function(id){
        //console.log(id);
        gData.dataAction('delete',id);
        //console.log($scope.list);
        if($scope.list.length==1){
            refreshTypes();
        }
        $scope.list = gData.getByType($scope.currentType);
    };

{%endhighlight%}
这里有一些特殊处理了，因为angular是双向绑定，但我这里对list做了多次赋值操作，这就导致了修改某次列表对应的变量，并不会带来dom的一个相应，所以需要对list做一次重新赋值；
并且，在这里删除时赋值前作的`list.length`判断，其实是针对于，当我点击某个类型的数据展示的时候，我点击删除其中一个数据，此时list并没有对应删除数据，而我要判断当某个类型数据都删完时，需要刷新类型数据，此时，只能先做判断【我感觉是我对`angular`应用规范不熟悉，所以遇到bug只能暂时这么处理着先】

那么到此为止，剩下的就是表单的实现了。先看模板：
{%highlight html%}
<div class="add-form">
    <div class="form-line">
        <label for="url_input">URL&ensp;:</label>
        <input type="text" id="url_input" ng-model="url.link" placeholder="请输入url">
    </div>
    <div class="form-line">
        <label for="desc_input">描述:</label>
        <input type="text" id="desc_input" ng-model="url.desc" placeholder="请输入描述">
    </div>
    <div class="form-line">
        <div class="styled-select blue semi-square">
            <select id="type_input" ng-model="listType" ng-init="listType=types2Select[0]" ng-options="type.label for type in types2Select" ng-change="selectType()">
            </select>
        </div>
    </div>
    <div class="form-line" ng-class="{hidden:!showNewType}">
        <label for="new_type_input">类型:</label>
        <input type="text" id="new_type_input" ng-model="url.type" placeholder="请输入新类型">
    </div>
    <button class="btn" ng-click="addUrl(url)">提交</button>
</div>

{%endhighlight%}
这个内容比较多了，多出的知识点：
`ng-model`锁定了url对象的某个属性,这样我们在点击提交按钮的触发函数里直接可以用url这个作为实参来传递整个数据组合

再看select标签，这里用了`ngInit`和`ngOptions`指令还有`ngChange`
最后那个是change事件触发跟click差不多，

`ngOptions`则跟`ngRepeat`有点相似，不过这个用于select标签，语法细化到输出label和value两个值。 看模板上的使用：
{%highlight html%}
<select id="type_input" ng-model="listType" ng-init="listType=types2Select[0]" ng-options="type.label for type in types2Select" ng-change="selectType()">
</select>

{%endhighlight%}
将生成option标签值为type，text文本为`type.label`，`ngOption`除了可以遍历数组， 还能遍历对象的，具体用法可看`angular`官网。

`ngInit`则是能让你在模板上使用表达式，比方这里模板上设置了对应的listType，但js里面并没有往`$scope.listType`设置初始值的时候，可在`ngInit`处设置listType的值。

{%highlight javascript%}
    //选择类型响应
    $scope.selectType = function(){
        //console.log($scope.listType); 
        $scope.url.type = '';
        if(!$scope.listType){
            $scope.listType = $scope.types2Select[0];
        }
        if($scope.listType.key=='add-new'){
            $scope.showNewType = true;
            return;
        }
        $scope.showNewType = false;
    };

    //提交新url
    $scope.addUrl = function(url){
        if($scope.listType.key!='add-new'){
            url.type = $scope.listType.key;
            gData.dataAction('add',url);
        }else{
            gData.dataAction('add',url);
            refreshTypes();
        }
        
        $scope.url = {
            link:'',
            desc:'',
            type:''
        };
    }

{%endhighlight%}
这里js只要实现触发change处理，以及按钮提交处理，遇到的逻辑坑是改变绑定数据导致`ngChange`，此时`ngInit`早已过了执行(不会再执行)，需要代码做判断初始化model数据。

也是第一次用angular来做一点点小实践，可能理念不一样，一个是对双向绑定，不好适应，所以也导致实现过程中，各种逻辑要写一些判断处理来修复bug，但相应的js代码量可观，只是加上模板的话，就不一定有所优势。

模板：
{%highlight html%}
    <div id="content">
        <div class="url-box" ng-controller="ubCtrl">
            <div class="add-form">
                <div class="form-line">
                    <label for="url_input">URL&ensp;:</label>
                    <input type="text" id="url_input" ng-model="url.link" placeholder="请输入url">
                </div>
                <div class="form-line">
                    <label for="desc_input">描述:</label>
                    <input type="text" id="desc_input" ng-model="url.desc" placeholder="请输入描述">
                </div>
                <div class="form-line">
                    <div class="styled-select blue semi-square">
                        <select id="type_input" ng-model="listType" ng-init="listType=types2Select[0]" ng-options="type.label for type in types2Select" ng-change="selectType()">
                        </select>
                    </div>
                </div>
                <div class="form-line" ng-class="{hidden:!showNewType}">
                    <label for="new_type_input">类型:</label>
                    <input type="text" id="new_type_input" ng-model="url.type" placeholder="请输入新类型">
                </div>
                <button class="btn" ng-click="addUrl(url)">提交</button>
            </div>
            <div class="all-list">
                <div class="list-type">
                    <a class="type-item" ng-repeat="type in types" ng-class="{active:currentType==type}"  ng-click="showList(type)">{{type}}</a>
                </div>
                <div class="list">
                    <p class="item" ng-repeat="item in list">
                        <a href="{{item.link}}">{{item.desc}}</a>
                        <a class="close" ng-click="deleteItem(item.id)">删除</a>
                    </p>
                </div>
            </div>
        </div>
    </div>

{%endhighlight%}
js：
{%highlight javascript%}
/*data*/
var gData = {
    data:[{
        id:1,
        type:'search',
        link:'http://baidu.com',
        desc:'百度'
    },{
        id:2,
        type:'search',
        link:'http://google.com',
        desc:'google'
    },{
        id:3,
        type:'sns',
        link:'http://facebook.com',
        desc:'facebook'
    },{
        id:4,
        type:'sns',
        link:'http://weibo.com',
        desc:'微博'
    },{
        id:5,
        type:'infos',
        link:'http://qq.com',
        desc:'QQ'
    },{
        id:6,
        type:'infos',
        link:'http://sina.com',
        desc:'渣浪'
    },{
        id:7,
        type:'infos',
        link:'http://yahoo.com',
        desc:'雅虎'
    },{
        id:8,
        type:'knowledge',
        link:'http://sf.gg',
        desc:'sf'
    },{
        id:9,
        type:'knowledge',
        link:'http://zhihu.com',
        desc:'知乎'
    }],
    getTypeList:function(){
        var types=[];
        this.data.forEach((e,i)=>{
            if(types.indexOf(e.type)==-1){
                types.push(e.type);
            }
        });
        return types;
    },
    getByType:function(type){
        //console.log('get list call');
        if(type==undefined||type==""){
            return this.data;
        }
        return this.data.filter(function(e){
            return type==e.type;
        });
    },
    add:function(obj){
        var descData = this.data.slice(0).sort(function(a,b){ return b.id-a.id;});
        //console.log(descData);
        if(descData.length==0){
            descData[0] = {
                id:0
            };
        }
        obj.id = descData[0].id+1;
        console.log(obj.id);
        this.data.push(obj);

    },
    delete:function(id){
        var index = -1;
        this.data.forEach(function(e,i){
            if(e.id==id){
                index = i;
            }
        });
        if(index==-1){
            return;
        }
        this.data.splice(index,1);
    },
    dataAction:function(fnType){
        var arg = [].slice.call(arguments, 1);
        try{

            switch(fnType){
                case 'add':
                    this.add(arg[0]);
                    break;
                case 'delete':
                    this.delete(arg[0]);
                    break;
                default:
                    return;
            }
        }catch(e){
            return;
        }
        this.refresh();
    },
    refresh:function(){
        return;
        if(window.localStorage){
            localStorage.setItem('urls', JSON.stringify(this.data));
        }
    }
};

if(window.localStorage){
    var store = localStorage.getItem('urls');
    try{
        store = JSON.parse(store);
        if(store && store.length){
            gData.data = store;
        }
    }catch(err){
        console.log(err);
    }
}
/*end data*/

var app = angular.module('ubApp', []);

app.controller('ubCtrl', function($scope){
    var refreshTypes = function(){
        $scope.types = gData.getTypeList();
        $scope.types2Select = $scope.types.map(function(e,i){
            var typeObj = {};
            typeObj['label'] = e;
            typeObj['key'] = e;
            return typeObj;
        }).concat({
            label:'新增类型',
            key:'add-new'
        });
        $scope.currentType = '';
        //console.log($scope.types.length);
    };

    $scope.list = gData.getByType();
    
    refreshTypes();


    $scope.url = {
        link:'',
        desc:'',
        type:''
    };

    
    //console.log($scope.types2Select);

    //$scope.listType = $scope.types[0];
    //删除item
    $scope.deleteItem = function(id){
        //console.log(id);
        gData.dataAction('delete',id);
        //console.log($scope.list);
        if($scope.list.length==1){
            refreshTypes();
        }
        $scope.list = gData.getByType($scope.currentType);
    };
    //显示新增类型输入框
    $scope.showNewType = $scope.types2Select[0]['key']=='add-new';

    //选择类型响应
    $scope.selectType = function(){
        //console.log($scope.listType); 
        $scope.url.type = '';
        //在删掉某个分类的时候，刷新分类数据，导致dom触发ngChange
        //由于此时ngInit不会执行 ，所以这里要做listType初始化
        if(!$scope.listType){
            $scope.listType = $scope.types2Select[0];
        }
        if($scope.listType.key=='add-new'){
            $scope.showNewType = true;
            return;
        }
        $scope.showNewType = false;
    };

    $scope.showList = function(type){
        $scope.currentType = type;
        $scope.list = gData.getByType(type);
        if($scope.list.length==0){
            refreshTypes();
        }
    };

    //提交新url
    $scope.addUrl = function(url){
        if($scope.listType.key!='add-new'){
            url.type = $scope.listType.key;
            gData.dataAction('add',url);
        }else{
            gData.dataAction('add',url);
            refreshTypes();
        }
        //提交后清空输入框内容
        $scope.url = {
            link:'',
            desc:'',
            type:''
        };
    }
});


{%endhighlight%}